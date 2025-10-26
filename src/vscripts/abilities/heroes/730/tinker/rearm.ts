import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class tinker_rearm_custom_730 extends BaseAbility {
    private readonly castParticle: string = "particles/units/heroes/hero_tinker/tinker_rearm.vpcf";
    private readonly castSound: string = "Hero_Tinker.Rearm";
    
    private itemExceptions: Array<string> = [
        "item_aeon_disk",
        "item_arcane_boots",
        "item_black_king_bar",
        "item_hand_of_midas",
        "item_helm_of_the_dominator",
        "item_meteor_hammer",
        "item_necronomicon",
        "item_necronomicon_2",
        "item_necronomicon_3",
        "item_refresher",
        "item_refresher_custom",
        "item_refresher_shard",
        "item_pipe",
        "item_sphere"
    ];

    private IsItemException(item: CDOTA_Item): boolean {
        return this.itemExceptions.includes(item.GetName());
    }

    private currentGesture: GameActivity = this.GetChannelAnimation();

    IsStealable(): boolean {
        return false;
    }

    GetChannelAnimation(): GameActivity {
        return 1554 + this.GetLevel();
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();

        modifier_tinker_rearm_custom_730.apply(
            caster,
            caster,
            this,
            {
                duration: this.GetChannelTime()
            }
        );
        
        this.currentGesture = this.GetChannelAnimation();

        this.PlayEffects();
    }

    OnChannelFinish(interrupted: boolean): void {
        const caster = this.GetCaster();
        
        caster.StopSound(this.castSound);

        if (interrupted) {
            caster.RemoveModifierByName(modifier_tinker_rearm_custom_730.name);
            caster.FadeGesture(this.currentGesture);

            return;
        }

        caster.GetAbilities()
            .filter(ability => ability.GetAbilityType() !== AbilityTypes.ATTRIBUTES)
            .forEach(ability => ability.EndCooldown());

        caster.GetItems()
            .filter(item => item.GetPurchaser() === caster && !this.IsItemException(item))
            .forEach(item => item.EndCooldown());

        const tpScroll = caster.GetItemInSlot(InventorySlot.TP_SCROLL);
        if (tpScroll && !this.IsItemException(tpScroll)) {
            tpScroll.EndCooldown();
        }
    }

    private PlayEffects(): void {
        const caster = this.GetCaster();

        const particle = ParticleManager.CreateParticle(
            this.castParticle,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            caster
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            0,
            caster,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.ATTACK2,
            caster.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            1,
            caster,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.ATTACK3,
            caster.GetAbsOrigin(),
            true
        );
        ParticleManager.ReleaseParticleIndex(particle);

        caster.EmitSound(this.castSound);
    }
}



@registerModifier()
class modifier_tinker_rearm_custom_730 extends BaseModifier {
    IsHidden(): boolean {
        return false;
    }
    
    IsPurgable(): boolean {
        return false;
    }

    IsPurgeException(): boolean {
        return false;
    }

    IsDebuff(): boolean {
        return false;
    }
}